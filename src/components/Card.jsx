import React from 'react';
import { useSelector } from 'react-redux';

const Card = ({ item, onAddToCart, onToggleFavorite }) => {
  const favorites = useSelector((state) => state.favorites.items);

  return (
    <div className="card-slide">
      <div className="card-content">
        {item.service_name && <h5 className="service-name">{item.service_name || 'Unknown Service'}</h5>}
        <div className="image-container">
          <img
            src={item.items_image || 'public/images/out bye.png'}
            alt={item.items_name}
            className="card-image"
            onError={(e) => (e.target.src = 'public/images/out bye.png')}
          />
        </div>
        <h3 className="card-title">{item.items_name || 'Unnamed Item'}</h3>
        <p className="card-description">{item.items_des || 'No description available.'}</p>
        <p className="price">
          {item.items_discount || (item.itemspricedisount && parseFloat(item.itemspricedisount) > 0) ? (
            <>
              <span className="old-price">{item.items_price || '0'} EGP</span>
              <span className="new-price">{item.items_discount || item.itemspricedisount || '0'} EGP</span>
            </>
          ) : (
            <span className="regular-price">{item.items_price || '0'} EGP</span>
          )}
        </p>
        <div className="card-actions">
          <button className="addItem-to-cart" onClick={() => onAddToCart(item.items_id)}>
            Add to Cart
          </button>
          <button
            className={`favorite-btn ${favorites.some(fav => String(fav.favorite_itemsid) === String(item.items_id)) ? 'favorited' : ''}`}
            onClick={() => onToggleFavorite(item.items_id)}
          >
            <i className={favorites.some(fav => String(fav.favorite_itemsid) === String(item.items_id)) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;