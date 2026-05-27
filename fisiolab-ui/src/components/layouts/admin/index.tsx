import { Portal, Box, useDisclosure } from '@chakra-ui/react';
import Footer from 'components/footer/FooterAdmin';
import Navbar from 'components/navbar/NavbarAdmin';
import Sidebar from 'components/sidebar/Sidebar';
import { SidebarContext } from 'store/SidebarContext';
import { useState, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import routes from 'routes';
import { useUser } from '@clerk/clerk-react';
import { getUserRole } from 'utils/auth';

export default function Dashboard(props: { [x: string]: any }) {
  const { ...rest } = props;
  const [fixed] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const { onOpen } = useDisclosure();
  const { user } = useUser();

  const userRole = user ? getUserRole(user) : undefined;

  const visibleRoutes = useMemo(
    () => routes.filter((r) => !r.roles || !userRole || r.roles.includes(userRole)),
    [userRole],
  );

  const adminRoutes = useMemo(
    () => visibleRoutes.filter((r) => r.layout === '/admin'),
    [visibleRoutes],
  );

  const getActiveRoute = (rs: RoutesType[]): string => {
    for (const r of rs) {
      if (window.location.href.includes(r.layout + r.path)) return r.name;
    }
    return 'FisioLab';
  };

  const getActiveNavbar = (rs: RoutesType[]): boolean => {
    for (const r of rs) {
      if (window.location.href.includes(r.layout + r.path)) return r.secondary ?? false;
    }
    return false;
  };

  const getActiveNavbarText = (rs: RoutesType[]): string | boolean => {
    for (const r of rs) {
      if (window.location.href.includes(r.layout + r.path)) return r.name;
    }
    return false;
  };

  document.documentElement.dir = 'ltr';

  return (
    <Box>
      <SidebarContext.Provider value={{ toggleSidebar, setToggleSidebar }}>
        <Sidebar routes={adminRoutes.filter((r) => !r.hidden)} display='none' {...rest} />
        <Box
          float='right'
          minHeight='100vh'
          height='100%'
          overflow='auto'
          position='relative'
          maxHeight='100%'
          w={{ base: '100%', xl: 'calc( 100% - 290px )' }}
          maxWidth={{ base: '100%', xl: 'calc( 100% - 290px )' }}
          transition='all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)'
          transitionDuration='.2s, .2s, .35s'
          transitionProperty='top, bottom, width'
          transitionTimingFunction='linear, linear, ease'>
          <Portal>
            <Box>
              <Navbar
                onOpen={onOpen}
                logoText='FisioLab'
                brandText={getActiveRoute(adminRoutes)}
                secondary={getActiveNavbar(adminRoutes)}
                message={getActiveNavbarText(adminRoutes)}
                fixed={fixed}
                {...rest}
              />
            </Box>
          </Portal>

          <Box mx='auto' p={{ base: '20px', md: '30px' }} pe='20px' minH='100vh' pt='50px'>
            <Routes>
              {adminRoutes.map((route, key) => (
                <Route path={route.path} element={route.component} key={key} />
              ))}
              <Route path='/' element={<Navigate to='/admin/dashboard' replace />} />
            </Routes>
          </Box>

          <Box>
            <Footer />
          </Box>
        </Box>
      </SidebarContext.Provider>
    </Box>
  );
}
