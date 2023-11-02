import ButtonLink from '@/components/ButtonLink/ButtonLink';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { metadata } from 'app/layout';
import Logo from '../../Logo/Logo';
// import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className='mt-[70px] mb-[100px] sm:my-[100px]' id='home'>
      <div className='mb-6'>
        <Logo />
      </div>
      <h1>{metadata.title.default}</h1>
      <div>
        <p className='my-0 mx-auto pt-3 px-0 pb-12 max-w-[500px]'>
          {metadata.description}
        </p>
      </div>
      <ButtonLink
        text='Contribute on GitHub'
        url='https://github.com/Latina-Dev/latina-dev'
        external={true}
        icon={faGithub}
      />
    </section>
  );
}
