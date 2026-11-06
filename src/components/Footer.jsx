import { WHATSAPP } from '../utils/constants';

export default function Footer() {
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola eunoia! Quiero consultar por sus productos.')}`;
  return (
    <footer>
      <div className="w">
        <img className="flogo" src="/img/logo-full.png" alt="eunoia 925" />
        <p>Joyas en Plata 925</p>
        <p>
          ¿Dudas sobre talles, stock o envíos?{' '}
          <a href={wa} target="_blank" rel="noopener noreferrer">Escribinos por WhatsApp</a>
        </p>
      </div>
    </footer>
  );
}
