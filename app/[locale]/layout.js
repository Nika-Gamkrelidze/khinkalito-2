import {NextIntlClientProvider} from 'next-intl';

export const metadata = {
	title: 'Khinkalito — Georgian Khinkali Delivery',
	description: 'Order authentic Georgian khinkali (dumplings). Admin panel included.'
};

export default async function LocaleLayout({children, params}) {
	const {locale} = await params;
	let messages;
	try {
		messages = (await import(`../../messages/${locale}.json`)).default;
	} catch (e) {
		messages = (await import(`../../messages/en.json`)).default;
	}

	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			{children}
		</NextIntlClientProvider>
	);
}


