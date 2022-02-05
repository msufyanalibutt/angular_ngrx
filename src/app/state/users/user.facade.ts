import { Injectable }                 from '@angular/core';
import { Store }                      from '@ngrx/store';
import { Effect, Actions }            from '@ngrx/effects';

import * as firebase                  from 'firebase';
import { AngularFireDatabase }        from 'angularfire2/database';
import { AngularFireAuth }            from 'angularfire2/auth';

import { Observable }                 from 'rxjs/Observable';
import { defer } from 'rxjs/observable/defer';
import '../../utils/rxjs.operators';

import {AppState} from '../state';
import {User} from './user.model';
import {UsersQuery} from './user.reducer';

import * as userActions from './user.actions';
type Action = userActions.All;


@Injectable()
export class UserFacade {

  

  user$ = this.store.select(UsersQuery.getUser);



  @Effect() getUser$: Observable<Action> = this.actions$.ofType(userActions.GET_USER)
               .map((action: userActions.GetUser) => action.payload )
               .switchMap(payload => this.afAuth.authState )
               .delay(2000) 
               .map( authData => {
                   if (authData) {
                       const user = new User(authData.uid, authData.displayName);
                       return new userActions.Authenticated(user);
                   } else {
                       return new userActions.NotAuthenticated();
                   }

               })
               .catch(err =>  Observable.of(new userActions.AuthError()) );


 
     @Effect() login$: Observable<Action> = this.actions$.ofType(userActions.GOOGLE_LOGIN)
                 .map((action: userActions.GoogleLogin) => action.payload)
                 .switchMap(payload => {
                     return Observable.fromPromise( this.googleLogin() );
                 })
                 .map( credential => {
                    
                     return new userActions.GetUser();
                 })
                 .catch(err => {
                     return Observable.of(new userActions.AuthError({error: err.message}));
                 });


     @Effect() logout$: Observable<Action> = this.actions$.ofType(userActions.LOGOUT)
                 .map((action: userActions.Logout) => action.payload )
                 .switchMap(payload => {
                     return Observable.of( this.afAuth.auth.signOut() );
                 })
                 .map( authData => {
                     return new userActions.NotAuthenticated();
                 })
                 .catch(err => Observable.of(new userActions.AuthError({error: err.message})) );


      @Effect({dispatch: false})
      init$: Observable<any> = defer(() => {
        this.store.dispatch(new userActions.GetUser());
      });


  constructor(
      private actions$: Actions,
      private store: Store<AppState>,
      private afAuth: AngularFireAuth,
      private db: AngularFireDatabase
  ) { }

 
  login() : Observable<User> {
    this.store.dispatch(new userActions.GoogleLogin());
    return this.user$;
  }

  logout() : Observable<User> {
    this.store.dispatch(new userActions.Logout());
    return this.user$;
  }


  protected googleLogin(): firebase.Promise<any> {
       const provider = new firebase.auth.GoogleAuthProvider();
       return this.afAuth.auth.signInWithPopup(provider);
   }

}
