import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  uploadExcel: defineAction({
    accept: 'form',
    input: z.object({
      file: z.instanceof(File),
    }),
    handler: async ({ file }) => {
      const res = await fetch('http://localhost:8787/upload', {
        method: 'POST',
        body: (() => {
          const form = new FormData();
          form.append('file', file);
          return form;
        })(),
      });

      if (!res.ok) throw new Error('Upload failed');
      return await res.json();
    },
  }),
};