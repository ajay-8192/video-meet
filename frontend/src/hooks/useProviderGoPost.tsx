import { useState } from "react";
import { beamItUp } from "../utils/api";

type BodyType = {
    [key: string]: any;
}

type SideEffectsType = {
    onSuccess?: (response: any) => void;
    onError?: (error: Error) => void;
};

const noop = () => {};


const defaultOptions: SideEffectsType = { 
    onSuccess: noop,
    onError: noop,
}

function useProvideGoPost() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const goPost = async (url: string, body: BodyType, sideEffects: SideEffectsType = defaultOptions) => {
        const { onSuccess, onError } = sideEffects;
        
        setLoading(true);
        try {
            setError(null);
            const response = await beamItUp(url, body);
            if(!response.requestStatus) {
                throw new Error(response.message);
            }
            setData(response);
            onSuccess?.(response);
        } catch (error: any) {
            setError(error.message);
            if (onError) {
                onError?.(error);
            }
        } finally {
            setLoading(false);
        }
    }

    return { data, loading, error, goPost }
}


export default useProvideGoPost;
