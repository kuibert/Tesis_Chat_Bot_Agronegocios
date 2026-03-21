import { Link } from "react-router";

export function RegisterPartail() {
  return (
    <div className="w-full h-100">
      <h1 className="text-xl md:text-2xl font-bold leading-tight mt-12">
        Registrate
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

      <p className="flex items-center mt-8 ">
        <span>Ya tengo una cuenta</span>

        <Link to={".."} className="btn btn-link pl-1">Volver</Link>
        {/* <a href="#" className="text-blue-500 hover:text-blue-700 font-semibold">
          V
        </a> */}
      </p>
    </div>
  );
}
