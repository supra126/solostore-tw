'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createCheckout } from './actions';

type CheckoutButtonProps = {
  productId: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
};

export function CheckoutButton({ productId, size, className }: CheckoutButtonProps) {
  const [pending, setPending] = useState(false);

  async function checkout() {
    setPending(true);
    try {
      const target = await createCheckout(productId);
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = target.actionUrl;
      for (const [name, value] of Object.entries(target.fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      setPending(false);
      window.alert(error instanceof Error ? error.message : '無法建立訂單');
    }
  }

  return (
    <Button onClick={checkout} disabled={pending} size={size} className={className}>
      {pending ? '前往付款中…' : '立即購買'}
    </Button>
  );
}
