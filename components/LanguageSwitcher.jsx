"use client";

import {useLocale} from "next-intl";
import {usePathname, useRouter} from "next/navigation";
import {useMemo} from "react";

export default function LanguageSwitcher() {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	const otherLocale = locale === "en" ? "ka" : "en";

	const targetPath = useMemo(() => {
		if (!pathname) return `/${otherLocale}`;
		const segments = pathname.split("/").filter(Boolean);
		if (segments.length === 0) return `/${otherLocale}`;
		segments[0] = otherLocale;
		return "/" + segments.join("/");
	}, [pathname, otherLocale]);

	return (
		<button
			onClick={() => router.push(targetPath)}
			className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
			aria-label="Switch language"
		>
			{otherLocale.toUpperCase()}
		</button>
	);
}


