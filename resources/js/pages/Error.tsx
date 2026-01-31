import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';

type Props = {
    status: number;
    message?: string;
};

const defaultMessages: Record<number, string> = {
    403: "You don't have permission to access this page.",
    404: 'The page you are looking for could not be found.',
    500: 'An unexpected error occurred. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
};

export default function Error({ status, message }: Props) {
    const displayMessage = message || defaultMessages[status] || 'An error occurred.';

    const handleGoHome = () => {
        router.visit('/');
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <>
            <Head title={`Error ${status}`} />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
                <div className="text-center">
                    <h1 className="text-7xl font-bold text-primary">{status}</h1>
                    <p className="mt-4 text-xl text-muted-foreground">
                        {displayMessage}
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button onClick={handleGoHome} variant="default">
                            Go to Home
                        </Button>
                        {status === 503 && (
                            <Button onClick={handleRefresh} variant="outline">
                                Try Again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
