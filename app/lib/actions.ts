'use server';
import {z} from 'zod';
import postgres from 'postgres';
import { redirect } from  'next/navigation';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.POSTGRES_URL!, {ssl: 'require'});

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid', 'pending']),
    data: z.string(),
});

const CreateInvoice = FormSchema.omit({id: true, data: true});
const UpdateInvoice = FormSchema.omit({id: true, data: true});

 
export async function createInvoice(formData: FormData) {
  const {customerId, amount, status} = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // Test it out:
  const amountNumber = amount*100;
  const date = new Date().toISOString().split('T')[0];

  try{
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountNumber}, ${status}, ${date})
  `;
  } catch (error) {
    console.error(error);
    throw new Error('Database Error creating invoice');
  };
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const {customerId, amount, status} = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountNumber = amount*100;

  try {
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountNumber}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    console.error(error);
    throw new Error('Database Error updating invoice');
  };
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {


  try{
    await sql`
      DELETE FROM invoices
      WHERE id = ${id}
    `;
    } catch (error) {
      console.error(error);
      throw new Error('Database Error deleting invoice');
  };
  revalidatePath('/dashboard/invoices');
}