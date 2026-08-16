ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS village text;

UPDATE public.posts SET village = 'Palacios de Sanabria' WHERE id = '9e5c3a1a-a44a-4f7c-910d-969fca7b88e1';
UPDATE public.posts SET village = 'Valdespino de Sanabria' WHERE id = 'b383d017-7776-4565-af07-e12850867872';
UPDATE public.posts SET village = 'Barrio de Rábano' WHERE id = '1313855f-bf03-4ec3-8f5d-45acd22fb431';
UPDATE public.posts SET village = 'Vigo de Sanabria' WHERE id = 'c2918be3-c602-492c-b51d-8988fd862fb2';
UPDATE public.posts SET village = 'Rionegrito' WHERE id = 'b60ae81e-7dff-462b-b491-fcf5da2ffcc9';
UPDATE public.posts SET village = 'Entrepeñas' WHERE id = '94aebb33-9729-4f43-99fe-866dc2f54cea';
UPDATE public.posts SET village = 'Puebla de Sanabria' WHERE id = '7b7a5927-b96c-4756-ad6d-d6b6e4cc5d90';
UPDATE public.posts SET village = 'Sanabria' WHERE id = 'ab022e57-9001-44c8-abde-b5d4ad28c537';
UPDATE public.posts SET village = 'San Juan de la Cuesta' WHERE id = '6b4d9fa1-888a-4ca3-ad35-7bb799abab74';
UPDATE public.posts SET village = 'Trefacio' WHERE id = '68827b0a-7c9b-4989-8529-be6143d50e27';
UPDATE public.posts SET village = 'Rosinos de la Requejada' WHERE id = '62d44423-bb0c-4ad1-85bd-b88a847e48a6';
UPDATE public.posts SET village = 'Cobreros' WHERE id = 'aeaacb22-76a9-479f-b15a-543a32349e91';
UPDATE public.posts SET village = 'Castellanos de Sanabria' WHERE id = '990ce730-c0de-4a11-b3ae-c0606396bdec';