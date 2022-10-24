import backgroundImage from "/webb-pattern.png";
import type { FunctionalComponent, FunctionComponent, JSX } from "preact";
import { useState } from "preact/hooks";
import clsx from "clsx";

const Button: FunctionComponent<JSX.HTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        "inline-flex justify-center rounded-2xl bg-primary-600 p-4 text-base font-semibold text-white",
        "hover:bg-primary-500 active:text-white/70",
        "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        className
      )}
      {...props}
    >
      <span className="sr-only sm:not-sr-only">{children}</span>
      <span className="sm:hidden">
        <ArrowRightIcon className="h-6 w-6" />
      </span>
    </button>
  );
};

const ArrowRightIcon: FunctionComponent<JSX.SVGAttributes<SVGSVGElement>> = (
  props
) => {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path
        d="m14 7 5 5-5 5M19 12H5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const CallToAction: FunctionalComponent = () => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [error, setError] = useState("");

  const createNewSubscriber: JSX.GenericEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();
    const { value: email } = event.currentTarget[0] as HTMLInputElement;
    const referrer_url = window.location.href;
    try {
      await fetch(`/.netlify/functions/create-new-subscriber`, {
        method: "POST",
        body: JSON.stringify({ email, referrer_url }),
      });
      // TODO: add fathom to window type
      // @ts-ignore
      if (window.fathom) window.fathom.trackGoal("XYTTAMX5", 0);
      setIsSubscribed(true);
    } catch (error: any) {
      setError(error.message ? error.message : "Error creating subscriber");
    }
  };

  return (
    <section id="newsletter" aria-label="Newsletter">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          style={`background-image: url(${backgroundImage})`}
          className="bg-repeat rounded-2xl shadow-lg px-4 md:px-6 py-8 md:py-12 border-2 border-primary-100"
        >
          <div className="relative mx-auto grid max-w-2xl grid-cols-1 gap-x-32 gap-y-14 xl:max-w-none xl:grid-cols-2">
            <div>
              <p className="font-display text-4xl font-medium tracking-tighter text-primary-900 sm:text-5xl">
                Stay up to date
              </p>
              <p className="mt-4 text-lg tracking-tight text-primary-700 leading-tight">
                Get updates on my latest content on web development, vim, macOS,
                working from home, productivity, and more.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold tracking-tight text-primary-900">
                Sign up to my newsletter{" "}
                <span className="text-primary-400" aria-hidden="true">
                  &darr;
                </span>
              </h3>

              {isSubscribed ? (
                <div className="mt-5 rounded-3xl bg-primary-500 px-6 py-5">
                  <p className="font-extrabold text-3xl text-primary-100">
                    🎉 Thanks for subscribing!
                  </p>
                </div>
              ) : (
                <form onSubmit={createNewSubscriber}>
                  <div className="mt-5 flex overflow-hidden rounded-3xl bg-white py-2.5 pr-2.5 shadow-xl shadow-primary-800/5 focus-within:ring-2 focus-within:ring-primary-800">
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      aria-label="Email address"
                      className="-my-2.5 flex-auto bg-transparent pl-6 pr-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    />
                    <Button type="submit">Sign up today</Button>
                  </div>
                  {error && (
                    <p className="ml-4 text-error-500 font-bold mt-4">
                      {error}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
