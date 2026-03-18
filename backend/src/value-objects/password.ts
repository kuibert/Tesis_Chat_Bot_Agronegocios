import bcrypt from "bcrypt";

export class Password {
  private readonly _value: string;
  private readonly SALT_ROUNDS = 10;

  private constructor(value: string) {
    this._value = value;
  } 
  
  public static create(plainPassword: string): Password {
    return new Password(plainPassword);
  }
 
  public async getHashedValue(): Promise<string> {
    return await bcrypt.hash(this._value, this.SALT_ROUNDS);
  }
 
  public async compare(hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(this._value, hashedPassword);
  }
 
  public get value(): string {
    return this._value;
  }
}
