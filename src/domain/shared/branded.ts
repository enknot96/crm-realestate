// 顧客データが下記のようになっていることを想定
// const customer = {
//   id: "cust_042",             // 顧客管理DBでのこの人のID(customerId)
//   lineUserId: "U4af49806...", // この人が持っているLINEアカウントのID
//   name: "田中太郎",
//   tags: ["売主"],
// };
// sendTo(customer.lineUserId); // 正しい: LINE宛のIDを渡している
// sendTo(customer.id); // ミス: 顧客IDの方を渡してしまった(単なるタイプミス・勘違い)
// 実行するまで気づけない

// declare = 型チェックのためだけの宣言
// uniqure symbol = 他と衝突しない目印を一つ作っている
// コンパイラに「これは他とは違う、区別できる1つのもの」として認識させる
declare const brand: unique symbol;

// readonly = 書き換え禁止
// & = 2つの型の要求を両方とも満たさなければいけない
// 型のテンプレートをつくる
// [brand]と書くことで、上記で宣言した あのdeclare const brandで作った、特定の個体そのものを指す
// 「書き換え不可能な、唯一無二の名札が貼られた、1個だけの箱に、後からBという型の中身が入ってくる」
export type Brand<T, B> = T & { readonly [brand]: B };

// 唯一無二の名札(brand)が貼られた、書き換え不可の箱」があり、その箱の中に「ただの中身(B、例えば"CustomerId"という紙切れ)」が入っている
//  「唯一無二・書き換え不可」なのは、箱(プロパティ)の方であって、中身(B)自体ではない
export type CustomerId = Brand<string, "CustomerId">;
export type LineUserId = Brand<string, "LineUserId">;
export type PropertyId = Brand<string, "PropertyId">;
export type ReportId = Brand<string, "ReportId">;
export type TagId = Brand<number, "TagId">;
export type BroadcastId = Brand<string, "BroadcastId">;
