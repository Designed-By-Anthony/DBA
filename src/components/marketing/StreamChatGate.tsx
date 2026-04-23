"use client";

import dynamic from "next/dynamic";

const StreamChatLazy = dynamic(
	() =>
		import("@/components/StreamChatWidget").then((m) => ({
			default: m.StreamChatWidget,
		})),
	{ ssr: false },
);

export function StreamChatGate() {
	if (process.env.NEXT_PUBLIC_ENABLE_STREAM_CHAT !== "1") return null;
	return <StreamChatLazy />;
}
