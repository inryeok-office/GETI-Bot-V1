/**
 * Discord API 호출 등 외부 의존이 무한정 걸리는 상황을 막기 위한
 * 최소한의 Timeout Helper.
 *
 * 복잡한 Retry/Circuit Breaker는 구현하지 않는다 — 주어진 시간 안에
 * promise가 끝나지 않으면 onTimeout()이 만든 오류로 거부할 뿐이다.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => Error,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(onTimeout()), ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error as Error);
      },
    );
  });
}
