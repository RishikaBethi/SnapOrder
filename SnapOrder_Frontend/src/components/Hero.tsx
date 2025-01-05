import hero from "../assets/snaporder_home.jpg";

const Hero = () => {
  return (
    <div>
      {/* <img src={hero} className="w-full max-h-[600px] object-cover" alt="Snaporder"/> */}
      <img src={hero} className="w-full max-h-[600px] object-cover" alt="Snaporder" width={100} height={100}/>
    </div>
  );
};

export default Hero;
