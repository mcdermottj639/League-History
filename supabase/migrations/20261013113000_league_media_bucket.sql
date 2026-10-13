-- v132: hosted ranking media. Public read so members' phones load GIFs by URL;
-- no client write policies — only the league-media edge function (service
-- role, publisher-verified) writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('league-media', 'league-media', true, 8388608, array['image/gif','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
