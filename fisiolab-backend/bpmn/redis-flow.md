# Redis Flow — FisioLab Backend

Stack: NestJS + `redis` npm client + `@nestjs/config` (REDIS_URL env var).

Módulos que usan Redis: `patients`, `users`.

---

## 1. Bootstrap — Ciclo de Vida del Módulo

```plantuml
@startuml
left to right direction

mxgraph.bpmn.event.start "NestJS\nApp Start" as boot_start
rectangle "Import RedisModule\n@Global() — disponible\nen todos los módulos" as boot_import
rectangle "RedisService\nonModuleInit()" as boot_init
rectangle "createClient\n({ url: REDIS_URL })" as boot_client
rectangle "client.on('error')\nLogger.error" as boot_err_listener
mxgraph.bpmn.gateway2.exclusive "client\n.connect()" as boot_gw
rectangle "Logger:\n'Redis connected'" as boot_log
mxgraph.bpmn.event.end "RedisService\nReady (Global)" as boot_end
mxgraph.bpmn.event.end "App Shutdown\nonModuleDestroy\nclient.quit()" as boot_shutdown

boot_start --> boot_import
boot_import --> boot_init
boot_init --> boot_client
boot_client --> boot_err_listener
boot_err_listener --> boot_gw
boot_gw --> boot_log : "OK"
boot_gw --> boot_err_listener : "error event"
boot_log --> boot_end
boot_end ..> boot_shutdown : "SIGTERM"
@enduml
```

---

## 2. Patrón Cache-Aside (Read-Through)

Aplica a: `findAll`, `findOne`, `findByCedula`, `findByExternalId`, `findByEmail`.

```plantuml
@startuml
left to right direction

mxgraph.bpmn.event.start "GET Request\n(Controller)" as r_start
mxgraph.bpmn.gateway2.exclusive "Tipo de\nbúsqueda?" as r_type

rectangle "Key: patients:all\nTTL: LIST=300s" as r_key_all
rectangle "Key: patients:id:{id}\nTTL: RECORD=600s" as r_key_id
rectangle "Key: patients:cedula:{c}\nTTL: RECORD=600s" as r_key_ced
rectangle "Key: users:id:{id}\nKey: users:email:{e}\nKey: users:ext:{extId}\nTTL: USER=900s" as r_key_user

rectangle "redis.get(key)\nJSON.parse" as r_redis_get
mxgraph.bpmn.gateway2.exclusive "Cache\nHit?" as r_hit

rectangle "Return cached\ndata (no DB)" as r_cache_return

rectangle "TypeORM\nfind / findOne\n(PostgreSQL)" as r_db
mxgraph.bpmn.gateway2.exclusive "Registro\nexiste?" as r_found

mxgraph.bpmn.event.errorEnd "NotFoundException\nHTTP 404" as r_404

rectangle "redis.set(\nkey, data, TTL\n)" as r_set_cache

mxgraph.bpmn.event.end "HTTP 200\nRetorna datos" as r_end

r_start --> r_type
r_type --> r_key_all : "findAll"
r_type --> r_key_id : "findOne(id)"
r_type --> r_key_ced : "findByCedula"
r_type --> r_key_user : "users.*"

r_key_all --> r_redis_get
r_key_id --> r_redis_get
r_key_ced --> r_redis_get
r_key_user --> r_redis_get

r_redis_get --> r_hit
r_hit --> r_cache_return : "HIT"
r_hit --> r_db : "MISS"

r_db --> r_found
r_found --> r_set_cache : "sí"
r_found --> r_404 : "no (findOne)"
r_set_cache --> r_end
r_cache_return --> r_end
@enduml
```

---

## 3. Patrón Write-Invalidation (Mutaciones)

Aplica a: `create`, `update`, `remove`, `createFromClerk`, `updateFromClerk`.

```plantuml
@startuml
left to right direction

mxgraph.bpmn.event.start "POST / PATCH\n/ DELETE" as w_start
mxgraph.bpmn.gateway2.exclusive "Operación?" as w_op

rectangle "Validate DTO\nVerificar cédula\nduplicada\nDB.save()" as w_create
rectangle "findOne (cache-aside)\nObject.assign(data)\nDB.save()" as w_update
rectangle "findOne (cache-aside)\nDB.remove()" as w_delete

rectangle "del(\n  patients:all\n)" as w_inv_c

rectangle "del(\n  patients:id:{id}\n  patients:cedula:{c}\n  patients:all\n)" as w_inv_u

rectangle "del(\n  patients:id:{id}\n  patients:cedula:{c}\n  patients:all\n)" as w_inv_d

mxgraph.bpmn.gateway2.exclusive "Users?" as w_user_op
rectangle "del(\n  users:all\n)" as w_inv_user_c
rectangle "del(\n  users:id\n  users:email\n  users:ext\n  users:all\n)" as w_inv_user_u

mxgraph.bpmn.event.end "HTTP 201/200/204\nDatos frescos\nproxima lectura" as w_end

w_start --> w_op
w_op --> w_create : "POST (patients)"
w_op --> w_update : "PATCH (patients)"
w_op --> w_delete : "DELETE (patients)"
w_op --> w_user_op : "users.*"

w_create --> w_inv_c
w_update --> w_inv_u
w_delete --> w_inv_d

w_user_op --> w_inv_user_c : "createFromClerk"
w_user_op --> w_inv_user_u : "updateFromClerk"

w_inv_c --> w_end
w_inv_u --> w_end
w_inv_d --> w_end
w_inv_user_c --> w_end
w_inv_user_u --> w_end
@enduml
```

---

## 4. invalidatePattern — Borrado por Glob (SCAN no-bloqueante)

Útil para futuros módulos (ej: `appointments:*`, `soap:patient:{id}:*`).

```plantuml
@startuml
left to right direction

mxgraph.bpmn.event.start "invalidatePattern\n('patients:*')" as s_start
rectangle "client.scanIterator\n({ MATCH: pattern\n  COUNT: 100 })" as s_scan
rectangle "Push keys al\nbatch toDelete[]" as s_collect
mxgraph.bpmn.gateway2.exclusive "¿Más\nbatches?" as s_more
rectangle "Promise.all(\n  keys.map(k =>\n    client.del(k)\n  )\n)" as s_del
mxgraph.bpmn.event.end "Todas las keys\ndel patrón\neliminadas" as s_end

s_start --> s_scan
s_scan --> s_collect
s_collect --> s_more
s_more --> s_scan : "sí (cursor ≠ 0)"
s_more --> s_del : "no (cursor = 0)"
s_del --> s_end
@enduml
```

---

## 5. Taxonomía de Keys y TTLs

| Clave | Valor | TTL | Invalidación |
|-------|-------|-----|--------------|
| `patients:all` | `Patient[]` | 300s (LIST) | create / update / remove |
| `patients:id:{uuid}` | `Patient` | 600s (RECORD) | update / remove |
| `patients:cedula:{cedula}` | `Patient` | 600s (RECORD) | update / remove |
| `users:all` | `User[]` | 300s (LIST) | createFromClerk / updateFromClerk |
| `users:id:{uuid}` | `User` | 900s (USER) | updateFromClerk |
| `users:email:{email}` | `User` | 900s (USER) | updateFromClerk |
| `users:ext:{clerkId}` | `User` | 900s (USER) | updateFromClerk |

### TTL Strategy
- `LIST=300s` — colecciones cambian más seguido
- `RECORD=600s` — registros individuales de paciente
- `USER=900s` — usuarios Clerk-managed, cambian poco

---

## 6. Flujo de Extensión para Nuevos Módulos

Al implementar `appointments`, `soap-notes`, etc., seguir este patrón:

```
// cache-keys.ts — agregar:
APPOINTMENTS_ALL: 'appointments:all',
APPOINTMENT_ID: (id: string) => `appointments:id:${id}`,
APPOINTMENTS_PATIENT: (patientId: string) => `appointments:patient:${patientId}`,

// TTL — colecciones → LIST, registros → RECORD

// En el service:
// GET: cache-aside con CK + TTL
// POST/PUT/DELETE: del() las keys afectadas
// Cross-entity: si update patient invalida appointments del paciente → del(CK.APPOINTMENTS_PATIENT(id))
```
