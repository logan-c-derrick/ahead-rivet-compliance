import SidebarLayout from "@/components/sidebar-layout";
import ProfileSubNav from "@/components/profile-sub-nav";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarLayout>
      <div className="flex flex-col lg:flex-row gap-8 pt-6 px-6 md:px-12 pb-12 max-w-screen-2xl mx-auto">
        <ProfileSubNav />
        {children}
      </div>
    </SidebarLayout>
  );
}
