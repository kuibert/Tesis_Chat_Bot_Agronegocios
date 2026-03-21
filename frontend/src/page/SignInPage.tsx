import { Link, useNavigate } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@tanstack/react-form";

import { GoogleIcon, MicrosoftIcon } from "@/components/icons";

type SignInForm = {
  email: string;
  password: string;
};

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as SignInForm,

    onSubmit: async ({ value }) => {
      await signIn({ provider: "local", data: { ...value } });

      navigate("/", { replace: true });
    },
  });

  return (
    <section className="flex flex-col md:flex-row h-screen items-center">
      <div className="bg-indigo-600 hidden lg:block w-full md:w-1/2 xl:w-2/3 h-screen">
        {/* <img
          src="https://source.unsplash.com/random"
          alt=""
          className="w-full h-full object-cover"
        /> */}
      </div>

      <div
        className="bg-base-100 w-full md:max-w-md lg:max-w-full md:mx-auto  md:w-1/2 xl:w-1/3 h-screen px-6 lg:px-16 xl:px-12
        flex items-center justify-center"
      >
        <div className="w-full h-100">
          <h1 className="text-xl md:text-2xl font-bold leading-tight mt-12">
            Inicia sesión con tu cuenta
          </h1>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  !value ? "El email es requerido" : undefined,
              }}
            >
              {(field) => (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Email</legend>

                  <input
                    type="text"
                    className="input w-full"
                    placeholder="user.example@gmail.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />

                  {field.state.meta.errors.length > 0 && (
                    <p className="fieldset-label text-error">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </fieldset>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  value.length < 6 ? "Mínimo 6 caracteres" : undefined,
              }}
            >
              {(field) => (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Password</legend>

                  <input
                    type="password"
                    className="input w-full"
                    placeholder="type here your password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />

                  {field.state.meta.errors.length > 0 && (
                    <p className="fieldset-label text-error">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </fieldset>
              )}
            </form.Field>

            <button type="submit" className="btn btn-primary w-full mt-6">
              Iniciar sesión
            </button>
          </form>

          <div className="divider"></div>

          <div className="flex flex-col gap-2">
            <button className="btn w-full">
              <GoogleIcon className="size-4" />
              Iniciar con Google
            </button>

            <button className="btn w-full">
              <MicrosoftIcon className="size-4" />
              Iniciar con Microsoft
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
