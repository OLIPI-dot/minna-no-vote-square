-- 📊 サイト全体の総投票数を返す関数
-- 今あるアンケート（surveys）に紐づく選択肢（options）の票だけを合計します。
-- 削除済みアンケートに残っている選択肢の票は数えません。
create or replace function public.get_total_votes()
returns bigint
language sql
stable
set search_path = public
as $$
  select coalesce(sum(o.votes), 0)::bigint
  from public.options o
  join public.surveys s on s.id = o.survey_id;
$$;

-- ログインしていない人（anon）もバナーで見られるように実行を許可
grant execute on function public.get_total_votes() to anon, authenticated;
