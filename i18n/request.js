import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
	const effectiveLocale = locale || 'en';
	let messages;
	try {
		messages = (await import(`../messages/${effectiveLocale}.json`)).default;
	} catch (e) {
		messages = (await import(`../messages/en.json`)).default;
	}

	return {
		locale: effectiveLocale,
		messages
	};
});


