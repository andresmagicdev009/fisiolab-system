import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockAppService = { health: jest.fn().mockResolvedValue({ status: 'ok' }) };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('health returns status ok', async () => {
    const result = await appController.health();
    expect(result).toMatchObject({ status: 'ok' });
  });
});
