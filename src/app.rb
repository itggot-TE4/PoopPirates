Dir.glob('models/*.rb') { |model| require_relative model }

class Application < Sinatra::Base

    before do
        headers 'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => ['OPTIONS', 'GET', 'POST']
    end

    get '/?' do
        slim :index
    end

    get '/api/send/request/?' do
        headers = {
            'Authorization' => 'token a6aced0802246927eaa3de49aedfa13cd30e26ec'
        }
        result = HTTParty.get(params['url'], :headers => headers)
        p result
        return result.to_json
    end
    
    get '/api/comments/get/?' do
        return SQLQuery.new.get('comments', ['id', 'text', 'sender']).where.if('projectId', params['projectId']).send.to_json
    end

    post '/api/comments/add/?' do
        SQLQuery.new.add('comments', ['text', 'projectId', 'sender'], [params['text'], params['projectId'], params['sender']]).send
    end
    
    delete '/api/comments/delete/?' do
        SQLQuery.new.del('comments').where.if('id', params['id']).send
    end

    get '/api/forks/status/?' do
        p params['projectId']
        return SQLQuery.new.get('status', ['status']).where.if('projectId', params['projectId']).send.first.to_json
    end

    post '/api/forks/status/?' do
        SQLQuery.new.add('status', ['projectId'], [params['projectId']]).send
    end

    patch '/api/forks/status/?' do
        SQLQuery.new.update('status', ['status'], [params['status']]).where.if('projectId', params['projectId']).send
    end
end