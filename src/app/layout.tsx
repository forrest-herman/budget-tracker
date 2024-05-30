"use client";
import "@/styles/globals.css";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { ThemeProvider } from "@/components/ThemeProvider";
import SettingsModal from "@/components/SettingsModal";
import { Toaster } from "@/components/ui/toaster";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
    const [isSettingsModalVisible, setIsSettingModalVisible] = useState(false);

    return (
        <html lang='en' suppressHydrationWarning>
            <head>
                <title>The Budget | Dashboard</title>
            </head>
            <body className='h-screen grid grid-cols-[48px_1fr] md:grid-cols-[200px_1fr] overflow-hidden'>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
                    <Nav isSettingsModalVisible={isSettingsModalVisible} setIsSettingModalVisible={setIsSettingModalVisible} />
                    <main className='h-full max-h-full w-full overflow-y-auto'>
                        {/* {<SettingsModal isSettingsModalVisible={isSettingsModalVisible} setIsSettingModalVisible={setIsSettingModalVisible} />} */}
                        <div className='min-h-full h-full flex flex-col justify-center items-center'>{children}</div>
                        <Toaster />
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
};

export default RootLayout;
