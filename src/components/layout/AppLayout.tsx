import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#f6f8fa]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
