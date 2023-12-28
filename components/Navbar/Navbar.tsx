import Link from 'next/link';

export default function Navbar() {
  return (
    // <nav className={styles.navbar}>
    <nav className='flex justify-center font-bold text-center m-2.5 mt-6'>
      <ul className='m-0 p-0'>
        <li className='list-none inline hover:text-primary transition-all duration-150 ease-in-out'>
          <Link href='/' className='mb-4 underline'>
            Home
          </Link>
        </li>
        <li className='list-none inline hover:text-primary transition-all duration-150 ease-in-out'>
          <Link href='/members/' className='mb-4 underline pl-4 sm:pl-10'>
            Members
          </Link>
        </li>
        <li className='list-none inline hover:text-primary transition-all duration-150 ease-in-out'>
          <Link
            href='https://forms.fillout.com/t/xARDm8SG6mus'
            target={'_blank'}
            className='mb-4 underline pl-4 sm:pl-10 inline-block'>
            Add your profile
          </Link>
        </li>
        <li className='list-none inline hover:text-primary transition-all duration-150 ease-in-out'>
          <Link
            href='https://github.com/Latina-Dev/latina-dev'
            target={'_blank'}
            className='mb-4 underline pl-4 sm:pl-10'>
            Contribute
          </Link>
        </li>
      </ul>
    </nav>
  );
}
