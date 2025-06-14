
import { useRef } from 'react';

interface ChapaFormValues {
  public_key: string;
  tx_ref: string;
  amount: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  title: string;
  description: string;
  logo: string;
  callback_url: string;
  return_url: string;
  "meta[title]": string;
}

interface ChapaPaymentFormProps {
  chapaFormValues: ChapaFormValues | null;
  soldOut: boolean;
  successfulTxRef: string | null;
  onSubmit: () => void;
}

const CHAPA_HTML_CHECKOUT_URL = "https://api.chapa.co/v1/hosted/pay";

export const ChapaPaymentForm = ({ 
  chapaFormValues, 
  soldOut, 
  successfulTxRef, 
  onSubmit 
}: ChapaPaymentFormProps) => {
  const chapaFormRef = useRef<HTMLFormElement | null>(null);

  // Expose the form ref to parent component
  if (chapaFormRef.current) {
    (window as any).chapaFormRef = chapaFormRef;
  }

  if (soldOut || successfulTxRef || !chapaFormValues) {
    return null;
  }

  return (
    <form
      ref={chapaFormRef}
      action={CHAPA_HTML_CHECKOUT_URL}
      method="POST"
      className="hidden"
      onSubmit={onSubmit}
    >
      <input type="hidden" name="public_key" value={chapaFormValues.public_key} />
      <input type="hidden" name="tx_ref" value={chapaFormValues.tx_ref} />
      <input type="hidden" name="amount" value={chapaFormValues.amount} />
      <input type="hidden" name="currency" value={chapaFormValues.currency} />
      <input type="hidden" name="email" value={chapaFormValues.email} />
      <input type="hidden" name="first_name" value={chapaFormValues.first_name} />
      <input type="hidden" name="last_name" value={chapaFormValues.last_name} />
      <input type="hidden" name="title" value={chapaFormValues.title} />
      <input type="hidden" name="description" value={chapaFormValues.description} />
      <input type="hidden" name="logo" value={chapaFormValues.logo} />
      <input type="hidden" name="callback_url" value={chapaFormValues.callback_url} />
      <input type="hidden" name="return_url" value={chapaFormValues.return_url} />
      <input type="hidden" name="meta[title]" value={chapaFormValues["meta[title]"]} />
    </form>
  );
};
