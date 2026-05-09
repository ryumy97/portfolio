"use client";

import tunnel from "./ui/tunnel";

const PageTunnel = tunnel();

export const PageTunnelIn = ({ children }: { children: React.ReactNode }) => {
	return <PageTunnel.In>{children}</PageTunnel.In>;
};

export const PageTunnelOut = () => {
	return <PageTunnel.OutAnimatePresence mode="popLayout" />;
};
