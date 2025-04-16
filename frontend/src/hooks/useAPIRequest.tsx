import { useState, useEffect, useCallback, useRef } from 'react';

type UseApiRequestOptions = RequestInit & {
	autoFetch?: boolean;
};

type UseApiRequestReturn<T> = {
	data: T | null;
	loading: boolean;
	error: string | null;
	refetch: (customUrl?: string, customOptions?: RequestInit) => Promise<T | void>;
	cancel: () => void;
};

function useApiRequest<T = any>(
	url: string,
	options: UseApiRequestOptions = {},
): UseApiRequestReturn<T> {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState<boolean>(!!options.autoFetch);
	const [error, setError] = useState<string | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const fetchData = useCallback(
		async (customUrl: string = url, customOptions: RequestInit = options): Promise<T | void> => {
			setLoading(true);
			setError(null);

			const controller = new AbortController();
			abortControllerRef.current = controller;

			try {
				const response = await fetch(customUrl, {
					...customOptions,
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const result: T = await response.json();
				setData(result);
				return result;
			} catch (err: any) {
				if (err.name === 'AbortError') {
					console.log('Fetch aborted');
				} else {
					setError(err.message || 'Something went wrong');
					setData(null);
				}
			} finally {
				setLoading(false);
			}
		},
		[url, options]
	);

	const cancel = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
	}, []);

	useEffect(() => {
		if (options.autoFetch) {
			fetchData();
		}
	}, [fetchData, options.autoFetch, cancel]);

	return { data, loading, error, refetch: fetchData, cancel };
}

export default useApiRequest;
