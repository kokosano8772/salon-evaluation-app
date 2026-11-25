-- LINE/電話/外部フォームの応募導線は、クリックしてもこちらのサーバーに何も送信しない
-- 設計（個人情報を一切取得しないため）のため、既存のapplication_success/failure_count
-- （メール応募のみ）には一切反映されない。個人情報を含まない「クリックされた回数」だけを
-- 別カウンタとして追加する（widget_load_countと同じ性質の匿名集計）。

alter table chatbot_usage_daily
  add column if not exists apply_link_click_count int not null default 0;

create or replace function public.chatbot_increment_usage(
  p_store_id uuid,
  p_date date,
  p_chat_message_count int default 0,
  p_ai_response_count int default 0,
  p_input_tokens int default 0,
  p_output_tokens int default 0,
  p_estimated_cost_usd numeric default 0,
  p_application_success_count int default 0,
  p_application_failure_count int default 0,
  p_widget_load_count int default 0,
  p_apply_link_click_count int default 0
) returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into chatbot_usage_daily (
    store_id, date, chat_message_count, ai_response_count, input_tokens, output_tokens,
    estimated_cost_usd, application_success_count, application_failure_count, widget_load_count,
    apply_link_click_count
  ) values (
    p_store_id, p_date, p_chat_message_count, p_ai_response_count, p_input_tokens, p_output_tokens,
    p_estimated_cost_usd, p_application_success_count, p_application_failure_count, p_widget_load_count,
    p_apply_link_click_count
  )
  on conflict (store_id, date) do update set
    chat_message_count = chatbot_usage_daily.chat_message_count + excluded.chat_message_count,
    ai_response_count = chatbot_usage_daily.ai_response_count + excluded.ai_response_count,
    input_tokens = chatbot_usage_daily.input_tokens + excluded.input_tokens,
    output_tokens = chatbot_usage_daily.output_tokens + excluded.output_tokens,
    estimated_cost_usd = chatbot_usage_daily.estimated_cost_usd + excluded.estimated_cost_usd,
    application_success_count = chatbot_usage_daily.application_success_count + excluded.application_success_count,
    application_failure_count = chatbot_usage_daily.application_failure_count + excluded.application_failure_count,
    widget_load_count = chatbot_usage_daily.widget_load_count + excluded.widget_load_count,
    apply_link_click_count = chatbot_usage_daily.apply_link_click_count + excluded.apply_link_click_count,
    updated_at = now();
$$;
