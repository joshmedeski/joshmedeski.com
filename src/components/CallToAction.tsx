import backgroundImage from "/webb-pattern.png";
import clsx from "clsx";
import type { FunctionalComponent, FunctionComponent, JSX } from "preact";
import { useState } from "preact/hooks";

const Button: FunctionComponent<JSX.HTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...props
}): JSX.Element => (
  <button
    className={clsx(
      "inline-flex justify-center",
      "rounded-2xl bg-primary-600 p-4",
      "text-base font-semibold text-white",
      "active:text-white/70 hover:bg-primary-500",
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

const ArrowRightIcon: FunctionComponent<JSX.SVGAttributes<SVGSVGElement>> = (
  props
): JSX.Element => (
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

const CallToAction: FunctionalComponent = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
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
      // cSpell:disable-next-line
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
          className="rounded-2xl border-2 border-primary-100 bg-repeat px-4 py-8 shadow-lg md:px-6 md:py-12"
        >
          <div className="relative mx-auto grid max-w-2xl grid-cols-1 gap-x-32 gap-y-14 xl:max-w-none xl:grid-cols-2">
            <div>
              <p className="font-display text-4xl font-medium tracking-tighter text-primary-900 sm:text-5xl">
                Stay up to date
              </p>
              <p className="mt-4 text-lg leading-tight tracking-tight text-primary-700">
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
                  <p className="text-3xl font-extrabold text-primary-100">
                    🎉 Thanks for subscribing!
                  </p>
                </div>
              ) : (
                <form onSubmit={createNewSubscriber}>
                  <div className="shadow-primary-800/5 mt-5 flex overflow-hidden rounded-3xl bg-white py-2.5 pr-2.5 shadow-xl focus-within:ring-2 focus-within:ring-primary-800">
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
                    <p className="ml-4 mt-4 font-bold text-error-500">
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
