"use client";

import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useEffect } from "react";

export default function GlobalError({
	error,
}: {
	error: Error & { digest?: string };
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html lang="en">
			<body>
				{/* App Router does not expose status codes for errors; `0` renders a generic message. */}
				<Error statusCode={0} />
			</body>
		</html>
	);
}
