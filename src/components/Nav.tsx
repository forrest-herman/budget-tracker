import { Button } from './ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '@/components/ui/navigation-menu';
import {
  HomeIcon,
  PlusIcon,
  PersonIcon,
  GearIcon,
  ListBulletIcon,
  BarChartIcon,
} from '@radix-ui/react-icons';
import { IconProps } from '@radix-ui/react-icons/dist/types';
import Link from 'next/link';
import { RefAttributes } from 'react';
import { MouseEventHandler } from 'react';

const NavLink = ({
  Icon,
  link,
  text,
}: {
  Icon: React.ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
  link: string;
  text: string;
}) => {
  return (
    <Link href={link}>
      <Button variant="ghost" className="h-12 w-full justify-start">
        <Icon className="h-4 w-4" />
        <span className="hidden mx-2 md:inline">{text}</span>
      </Button>
    </Link>
  );
};
// Import MouseEventHandler

const NavPopover = ({
  Icon,
  onClick,
  text,
}: {
  Icon: React.ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
  onClick: MouseEventHandler<HTMLDivElement>;
  text: string;
}) => {
  return (
    <div onClick={onClick}>
      <Button variant="ghost" className="h-12 w-full justify-start">
        <Icon className="h-4 w-4" />
        <span className="hidden mx-2 md:inline">{text}</span>
      </Button>
    </div>
  );
};

const Nav = ({
  isSettingsModalVisible,
  setIsSettingModalVisible,
}: {
  isSettingsModalVisible: boolean;
  setIsSettingModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <nav className="h-full w-full flex flex-col overflow-hidden">
      <div className="h-full flex flex-col justify-between">
        <div>
          <NavLink text="Dashboard" link="/" Icon={HomeIcon} />
          <NavLink text="Add Transaction" link="/add-transaction" Icon={PlusIcon} />
          <NavLink text="History" link="/transaction-history" Icon={ListBulletIcon} />
          <NavLink text="Insights" link="/insights" Icon={BarChartIcon} />
          <NavLink text="Cash Flow" link="/cash-flow" Icon={BarChartIcon} />
          <NavLink text="Budget" link="/budget" Icon={ListBulletIcon} />
          {/* <NavLink text="Reccuring" link="/reccuring" Icon={ListBulletIcon} /> */}
          {/* <NavLink text="Upload CSV" link="/upload-transactions" Icon={UploadIcon} /> */}
        </div>
        <div>
          <NavPopover
            text="Settings"
            onClick={() => setIsSettingModalVisible(!isSettingsModalVisible)}
            Icon={GearIcon}
          />
          <NavLink text="Sign Out" link="/api/auth/signout" Icon={PersonIcon} />
        </div>
      </div>
    </nav>
    // <NavigationMenu orientation="vertical">
    //   <NavigationMenuList className="flex-col items-start space-x-0">
    //     <NavigationMenuItem>
    //       <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
    //     </NavigationMenuItem>
    //     <NavigationMenuItem>
    //       <NavigationMenuTrigger>Item Two</NavigationMenuTrigger>
    //       <NavigationMenuContent>
    //         <NavigationMenuLink>Link</NavigationMenuLink>
    //         <NavigationMenuLink>Link 2</NavigationMenuLink>
    //       </NavigationMenuContent>
    //     </NavigationMenuItem>
    //     <NavigationMenuIndicator />
    //   </NavigationMenuList>
    // </NavigationMenu>
  );
};

export default Nav;
