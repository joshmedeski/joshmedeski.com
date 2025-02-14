import clsx from 'clsx'
import type { FunctionalComponent, FunctionComponent, JSX } from 'preact'
import { useState } from 'preact/hooks'

const Button: FunctionComponent<JSX.HTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...props
}): JSX.Element => (
  <button
    className={clsx(
      'inline-block rounded-lg font-bold tracking-wider',
      'px-6 py-4 text-2xl text-white',
      'bg-gradient-to-l from-indigo-500 to-purple-600',
      'shadow-lg hover:shadow-xl',
      'hover:from-indigo-700 hover:to-purple-800',
      'transition-all duration-300 ease-in-out',
      className,
    )}
    {...props}
  >
    <span className="sr-only sm:not-sr-only">{children}</span>
    <span className="sm:hidden">
      <ArrowRightIcon className="h-6 w-6" />
    </span>
  </button>
)

const ArrowRightIcon: FunctionComponent<JSX.SVGAttributes<SVGSVGElement>> = (
  props,
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
)

const PdeCtaInput: FunctionalComponent = () => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState('')

  const createNewSubscriber: JSX.GenericEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault()
    const { value: email } = event.currentTarget[0] as HTMLInputElement
    const referrer_url = window.location.href
    try {
      await fetch(`/.netlify/functions/create-new-subscriber`, {
        method: 'POST',
        body: JSON.stringify({ email, referrer_url, tags: ['waitlist'] }),
      })
      // TODO: add fathom to window type
      // @ts-ignore
      // cSpell:disable-next-line
      if (window.fathom) window.fathom.trackGoal('XYTTAMX5', 0)
      setIsSubscribed(true)
    } catch (error: any) {
      setError(error.message ? error.message : 'Error creating subscriber')
    }
  }

  return (
    <section id="pde-cta-input">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div>
          {isSubscribed ? (
            <div className="mt-5 rounded-xl bg-primary-500 bg-gradient-to-l from-indigo-500 to-purple-600 py-6">
              <p className="text-center text-3xl font-extrabold text-white">
                🎉 Thanks for joining the waitlist!
              </p>
            </div>
          ) : (
            <form onSubmit={createNewSubscriber}>
              <div className="shadow-primary-800/5 mt-5 flex overflow-hidden rounded-xl bg-white py-2.5 pr-2.5 shadow-xl focus-within:ring-2 focus-within:ring-primary-800">
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  aria-label="Email address"
                  className="-my-2.5 flex-auto bg-transparent pl-6 pr-2.5 text-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
                <Button type="submit">Join Waitlist</Button>
              </div>
              {error && (
                <p className="ml-4 mt-4 font-bold text-error-500">{error}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default PdeCtaInput
