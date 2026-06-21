import { Link, useNavigate } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import { useMsal } from "@azure/msal-react";
import { sileo } from "sileo";

import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@tanstack/react-form";

import { MicrosoftIcon } from "@/components/icons";
import { useState } from "react";

type SignInForm = {
  email: string;
  password: string;
};

export function SignInPage() {
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { instance } = useMsal();
  const navigate = useNavigate();

  const handleError = (err?: any) => {
    sileo.error({
      title: "Error al iniciar sesión",
      description: err ? err.message : "Porfavor intentalo mas tarde.",
    });
  };

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as SignInForm,

    onSubmit: async ({ value }) => {
      try {
        setLoading(true);

        await signIn({
          provider: "local",
          data: { ...value },
        });

        navigate("/", { replace: true });
      } catch (err: any) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleGoogleSignIn = async (response: any) => {
    try {
      setLoading(true);
      const token = response.credential;
      await signIn({
        provider: "google",
        data: {
          idToken: token,
          provider: "google",
        },
      });

      navigate("/", { replace: true });
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoft = async () => {
    try {
      setLoading(true);
      const loginResponse = await instance.loginPopup({
        scopes: ["openid", "profile", "email"],
      });
      const token = loginResponse.idToken;
      await signIn({
        provider: "microsoft",
        data: {
          idToken: token,
          provider: "microsoft",
        },
      });

      navigate("/", { replace: true });
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col md:flex-row h-screen items-center">
      {/* ── Panel Izquierdo de Branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-full md:w-1/2 xl:w-2/3 h-screen relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d3b1f 0%, #1a6b3c 40%, #145a32 70%, #0a2614 100%)' }}>

        {/* Círculos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2ecc71, transparent)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #27ae60, transparent)', transform: 'translate(30%, 30%)' }} />
        <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #2ecc71, transparent)', transform: 'translate(40%, -50%)' }} />

        {/* Encabezado — Logo + Nombre */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(46,204,113,0.2)', border: '1.5px solid rgba(46,204,113,0.5)' }}>
              🌱
            </div>
            <span className="text-white font-bold text-3xl tracking-wide">AgroBot</span>
          </div>
          <p className="text-green-300 text-sm tracking-widest uppercase font-medium ml-1">
            Asistente Agrícola con IA
          </p>
        </div>

        {/* Centro — Tagline + Features */}
        <div className="relative z-10 px-10 flex-1 flex flex-col justify-center">
          <h2 className="text-white font-bold leading-tight mb-2"
            style={{ fontSize: '2.4rem', lineHeight: '1.2' }}>
            El conocimiento agronómico<br />
            <span style={{ color: '#2ecc71' }}>en tus manos</span>, al instante.
          </h2>
          <p className="text-green-200 text-base mb-10 max-w-md" style={{ lineHeight: '1.7' }}>
            Accede a <strong className="text-white">calendarios de fertilización validados</strong> e información precisa
            respaldada por inteligencia artificial para tomar mejores decisiones en el campo.
          </p>

          {/* Feature cards */}
          <div className="flex flex-col gap-4 max-w-md">
            {[
              { icon: '🔍', title: 'Búsqueda semántica RAG', desc: 'Encuentra información exacta aunque no uses las palabras exactas.' },
              { icon: '🤖', title: 'IA completamente local', desc: 'Modelos eficientes que garantizan privacidad y rapidez. Sin costo por consulta.' },
              { icon: '🌱', title: 'Especializado en agricultura', desc: 'Datos reales para optimizar el manejo técnico de diversos cultivos.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(46,204,113,0.2)' }}>
                <span className="text-2xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-green-300 text-xs mt-0.5" style={{ lineHeight: '1.5' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer del panel */}
        <div className="relative z-10 p-10 flex items-center justify-between">
          <p className="text-green-400 text-xs">
            © 2026 AgroBot · Sistema Asistente Agrícola
          </p>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className={`h-1.5 rounded-full ${i === 0 ? 'w-5' : 'w-1.5'}`}
                style={{ background: i === 0 ? '#2ecc71' : 'rgba(255,255,255,0.25)' }} />
            ))}
          </div>
        </div>
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
                    disabled={loading}
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
                    disabled={loading}
                  />

                  {field.state.meta.errors.length > 0 && (
                    <p className="fieldset-label text-error">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </fieldset>
              )}
            </form.Field>

            <button
              disabled={loading}
              type="submit"
              className="btn btn-primary w-full mt-6"
            >
              Iniciar sesión
            </button>
          </form>

          <div className="divider"></div>

          <div className="flex flex-col gap-2">
            <div className={loading ? "pointer-events-none opacity-50" : ""}>
              <GoogleLogin
                onSuccess={handleGoogleSignIn}
                onError={() => handleError()}
              />
            </div>

            <button
              disabled={loading}
              onClick={handleMicrosoft}
              className="btn w-full"
            >
              <MicrosoftIcon className="size-4" />
              Iniciar con Microsoft
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
