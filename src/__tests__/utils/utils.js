// Helper para mostrar el mensaje si falla
export const assertTestResult = (res) => {
    if (!res.result) throw new Error(res.message);
    expect(res.result).toBe(true);
};