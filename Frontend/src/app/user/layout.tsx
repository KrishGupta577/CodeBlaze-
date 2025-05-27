import Footer from "@/components/Footer";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ConvexClientProvider>
                {children}
            </ConvexClientProvider>
            {/* <Footer></Footer> */}
        </>
    );
}