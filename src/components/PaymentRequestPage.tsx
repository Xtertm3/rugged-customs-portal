import React from 'react';
import { PaymentRequestForm } from './PaymentRequestForm';
import { PaymentRequestData as BasePaymentRequestData } from '../services/geminiService';
import { Site } from '../App';

interface PaymentRequestPageProps {
    onSubmit: (data: BasePaymentRequestData & { id?: string }, photos: File[], documents: File[]) => Promise<boolean>;
    onBack: () => void;
    isLoading: boolean;
    error: string | null;
    sites: Site[];
}

export const PaymentRequestPage: React.FC<PaymentRequestPageProps> = (props) => {
    // FIX: Removed `isDetailed` prop from PaymentRequestForm as it is not defined in the component's props.
    return (
        <PaymentRequestForm
            {...props}
        />
    );
};
