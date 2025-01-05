import SearchBar, { SearchForm } from "@/components/SearchBar";
import { useNavigate } from "react-router-dom";
import Helmet from "react-helmet";

const HomePage = () => {
  const navigate = useNavigate();

  const handleSearchSubmit = (searchFormValues: SearchForm) => {
    navigate({
      pathname: `/search/${searchFormValues.searchQuery}`,
    });
  };

  return (
    <div>
      <Helmet>
        <title>SnapOrder - Order, Pay, and Grab Away</title>
        <meta
          name="description"
          content="SnapOrder is your one-stop solution for hassle-free pre-ordering of food and stationery. Simplify your day with quick orders, secure payments, and no waiting in lines!"
        />
      </Helmet>
    <div className="flex flex-col gap-40">
      <div className="md:px-32 bg-white rounded-lg shadow-md py-8 flex flex-col gap-5 text-center -mt-80">
        <h1 className="text-5xl font-bold tracking-tight text-teal-600">
          Order, Pay, and Grab Away
        </h1>
        <span className="text-xl">Quick Picks for Every Day!</span>
        <SearchBar
          placeHolder="Search by Organization"
          onSubmit={handleSearchSubmit}
        />
      </div>
      <div className="flex flex-col gap-5 text-center">
          <h1 className="text-3xl font-bold tracking tight text-teal-600">
              About Us
          </h1>
          <span className="text">
          Welcome to SnapOrder, your one-stop solution for hassle-free pre-ordering of food and stationery within your organization. Whether you're grabbing a quick snack from the canteen or stocking up on essential supplies, we've got you covered.  

          Designed exclusively for offices and institutions, our platform connects you with multiple trusted vendors approved by your organization. Simply place your order, make an online payment, and pick it up when it's ready—no waiting in lines or unnecessary delays.  

          With features like order status updates, secure payments, and a comprehensive order history, SnapOrder ensures a seamless and efficient experience for both customers and vendors. Simplify your day with just a few clicks!
          </span>
      </div>
    </div>
    </div>
  );
};

export default HomePage;
