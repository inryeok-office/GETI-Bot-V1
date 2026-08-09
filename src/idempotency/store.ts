/**
 * 동일 Key로 다시 요청된 작업의 결과를 재사용하기 위한 Store 계약.
 *
 * 중요: 이 Interface는 "같은 Bot Process 생명주기 안"에서의 중복 방지만
 * 보장한다. Exactly-once를 보장하지 않으며, Process가 재시작되면 이전
 * 결과는 사라진다.
 */
export interface IdempotencyStore<T> {
  /**
   * key에 대해 이미 진행 중이거나 완료된 결과가 있으면 그 결과를 재사용하고,
   * 없으면 factory()를 정확히 한 번만 실행해 결과를 저장한다.
   *
   * factory()가 실패하면 해당 key의 항목을 제거해, 이후 재시도가 다시
   * 시도될 수 있게 한다(성공한 결과만 dedup 대상).
   */
  getOrCreate(key: string, factory: () => Promise<T>): Promise<T>;
}

/**
 * In-memory IdempotencyStore 구현.
 *
 * Process Restart를 넘는 내구성을 보장하지 않는다(In-memory이므로 재시작 시
 * 모든 기록이 사라진다). Redis 등 외부 저장소는 사용하지 않는다.
 *
 * 동시성: key 조회 직후 factory()가 반환한 Promise를 동기적으로 Map에
 * 저장한다. JavaScript는 단일 스레드로 동작하고 이 조회→저장 사이에
 * await 지점이 없으므로, 거의 동시에 들어온 요청도 같은 Promise를
 * 공유하게 되어 실제 작업(factory)은 한 번만 실행된다.
 */
export class InMemoryIdempotencyStore<T> implements IdempotencyStore<T> {
  private readonly entries = new Map<string, Promise<T>>();

  async getOrCreate(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing) {
      return existing;
    }

    const promise = factory();
    this.entries.set(key, promise);

    try {
      return await promise;
    } catch (error) {
      this.entries.delete(key);
      throw error;
    }
  }

  /** 현재 저장된 key 수. Test/디버깅 용도. */
  get size(): number {
    return this.entries.size;
  }
}
