import { ButtonHTMLAttributes } from "react";
import { buttonClassName, ButtonSize, ButtonVariant } from "./buttonStyles";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

// フォームの送信ボタン等、<button>として使う操作はこれで統一する
export function Button({ variant = "primary", size = "md", className, ...rest }: Props) {
  return (
    <button
      className={buttonClassName(variant, size, className)}
      {...rest}
    />
  );
}
