import { login } from "./actions";

export default function LoginPage() {
  return (
    // <form action={login}>が送信されると、そのフォーム内にあるname属性付きの入力欄が自動的に集められる
    // それらは、FormDataというオブジェクトにまとめられ、login関数の第一引数として渡してくれる
    <form action={login}>
      <input
        type="password"
        name="password"
        required
      />
      <button type="submit">ログイン</button>
    </form>
  );
}
