import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './view/searchView';
import * as recipeView from './view/recipeView';
import * as listView from './view/listView';
import * as likesView from './view/likesView';
import {elements, renderLoader, clearLoader} from './view/base';
 /**Global State of App
 * --Search object
 * - Current recipe
 * - Shopping list
 * - Liked recpies
 */ 
const state = {};
/** 
//SEARCH CONTROLLER
**/
const controlSearch = async () => {
    //Get Query From View
    const query = searchView.getInput();
    
    if(query){
        //New Search object and add to state
        state.search = new Search(query);
        
         //Prepare UI for results
         searchView.clearInput();
         searchView.clearResults();
         renderLoader(elements.searchRes);
         
        try{
            //Search for recipes
            await state.search.getResults();
        
            //Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }
        catch(err){
            alert(err);
        }
    }
 }

    elements.searchForm.addEventListener('submit', el => {
    el.preventDefault();
    controlSearch();
 });

 elements.searchResPages.addEventListener('click', element => {
    
    const btn = element.target.closest('.btn-inline');
        if(btn){
            const gotoPage = parseInt(btn.dataset.goto, 10);
            searchView.clearResults();
            searchView.renderResults(state.search.result, gotoPage);
        }
 });
/** 
//RECIPE CONTROLLER
**/
const controlRecipe = async () => {
    const id = window.location.hash.replace('#' , '');
    
    if(id){
        //Prepare UI for Changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight Selected Recipe
        if(state.search)searchView.HighlightSelected(id);

        //Prepare new recipe Objects
        state.recipe = new Recipe(id);
        
        try{
            //Get Recipe Data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //Calculate Servings and Time
            state.recipe.calcTime();
            state.recipe.calcServings();

            //Render Recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        }
        catch(error){
            alert(error);
        }
        
    }
}

//window.addEventListener('hashchange', controlRecipe);
//window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/** 
// LIST CONTROLLER
**/
const controlList = () => {
    // Create a new list IF there in none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}
    // Handle delete and update list item events
    elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

    // Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.UpdateCount(id, val);
    }
});


/** 
//LIKE CONTROLLER
**/
const ControlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User hasn't yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);

    // User has liked current recipe
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from UI 
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};
// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


//Handeling Button Clicks For Recipe
elements.recipe.addEventListener('click', el =>{
    if(el.target.matches('.btn-decrease, .btn-decrease *')){
        //Decrease button
        if(state.recipe.servings > 1) 
        state.recipe.UpdateServings('dec');
        recipeView.UpdateServingsIngredients(state.recipe);
    }
    else if(el.target.matches('.btn-increase, .btn-increase *')){
        //Increase button
        state.recipe.UpdateServings('inc');
        recipeView.UpdateServingsIngredients(state.recipe);
    }
    else if(el.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        //Add ingredients to list
        controlList();
    }
    else if(el.target.matches('.recipe__love, .recipe__love *')){
        //like Controller
        ControlLike();
    }
});



