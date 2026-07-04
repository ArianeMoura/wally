ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_groupExpenseId_userId_unique" UNIQUE("group_expense_id","user_id");--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_limit_non_negative" CHECK ("budgets"."limit_cents" >= 0);--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amount_positive" CHECK ("transactions"."amount_cents" > 0);--> statement-breakpoint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_non_negative" CHECK ("expense_shares"."share_cents" >= 0);--> statement-breakpoint
ALTER TABLE "group_expenses" ADD CONSTRAINT "group_expenses_amount_positive" CHECK ("group_expenses"."amount_cents" > 0);--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_amount_positive" CHECK ("settlements"."amount_cents" > 0);--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_distinct_parties" CHECK ("settlements"."from_user_id" <> "settlements"."to_user_id");