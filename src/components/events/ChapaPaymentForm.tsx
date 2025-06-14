
import { useEffect } from 'react';

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
  "meta[event_id]": string;
  "meta[tickets_quantity]": string;
}

interface ChapaPaymentFormProps {
  chapaFormValues: ChapaFormValues | null;
  soldOut: boolean;
  successfulTxRef: string | null;
  formRef: React.RefObject<HTMLFormElement>;
  onSubmit: () => void;
}

const CHAPA_CHECKOUT_URL = "https://api.chapa.co/v1/hosted/pay";

export const ChapaPaymentForm = ({ 
  chapaFormValues, 
  soldOut, 
  successfulTxRef, 
  formRef,
  onSubmit 
}: ChapaPaymentFormProps) => {

  if (soldOut || successfulTxRef || !chapaFormValues) {
    return null;
  }

  console.log('Rendering Chapa form with values:', chapaFormValues);

  return (
    <form
      ref={formRef}
      action={CHAPA_CHECKOUT_URL}
      method="POST"
      className="hidden"
      onSubmit={() => {
        console.log('Chapa form onSubmit triggered');
        onSubmit();
      }}
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
      <input type="hidden" name="meta[event_id]" value={chapaFormValues["meta[event_id]"]} />
      <input type="hidden" name="meta[tickets_quantity]" value={chapaFormValues["meta[tickets_quantity]"]} />
    </form>
  );
};
