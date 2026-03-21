import { Link } from "react-router";
import { GoogleIcon, MicrosoftIcon } from "@/components/icons";

export function SignInPartial() { 
  return (
    <div className="w-full h-100">
      <h1 className="text-xl md:text-2xl font-bold leading-tight mt-12">
        Inicia sesion con tu cuenta
      </h1>

      <form className="mt-6" action="#" method="POST">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Email</legend>
          <input
            type="text"
            className="input w-full"
            placeholder="user.example@gmail.com"
          />
          {/* options */}
          {/* <p className="fieldset-label">no empty</p> */}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Password</legend>
          <input
            type="password"
            className="input w-full"
            placeholder="type here your password"
          />
          {/* options */}
          {/* <p className="fieldset-label">no empty</p> */}
        </fieldset>

        <button type="submit" className="btn btn-primary w-full mt-6">
          Iniciar sesion
        </button>
      </form>

      <div className="divider"></div>

      <div className="flex flex-col gap-2">
        <button className="btn w-full">
          <GoogleIcon className="size-4" />
          Inicar con Google
        </button>
        <button className="btn w-full">
          <MicrosoftIcon className="size-4" />
          Inicar con Microsoft
        </button>
      </div>

      <p className="flex items-center mt-8 ">
        <span>Necesitas una cuenta?</span>

        <Link className="btn btn-link pl-1.5" to={"register"}>
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
