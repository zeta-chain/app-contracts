export const deepCloneSerializable = <Obj extends object>(serializableObject: Obj): Obj =>
  JSON.parse(JSON.stringify(serializableObject));
