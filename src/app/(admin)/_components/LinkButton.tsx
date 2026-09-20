import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";
import { buttonClassName, ButtonSize, ButtonVariant } from "./buttonStyles";

type Props = LinkProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

// ページ遷移する操作(「編集」「削除」等)は、ボタンに見える見た目に統一するためこれを使う
// (押せる操作なのに文字色だけのリンクだと、押せることが伝わらないため)
export function LinkButton({ variant = "primary", size = "md", className, children, ...linkProps }: Props) {
  return (
    <Link
      className={buttonClassName(variant, size, className)}
      {...linkProps}
    >
      {children}
    </Link>
  );
}
