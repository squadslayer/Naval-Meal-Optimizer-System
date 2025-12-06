import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { HomeIcon, UserCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const sailorNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'My Profile', href: '/sailor/profile', icon: UserCircleIcon },
  { name: 'Submit Feedback', href: '/sailor/feedback', icon: ChatBubbleLeftRightIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function SailorLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md flex-shrink-0">
          <nav className="p-4 space-y-1">
            {sailorNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/dashboard'}
                className={({ isActive }) =>
                  classNames(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                <item.icon className="h-6 w-6 mr-3 text-gray-500 group-hover:text-gray-700" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet /> {/* Sailor child routes will render here */}
        </main>
      </div>
    </div>
  );
}